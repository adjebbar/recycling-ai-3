"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ScanLine, RefreshCw } from 'lucide-react';
import QrCodeScanner from '@/components/QrCodeScanner';
import { format } from 'date-fns';

interface ValidatedVoucher {
  id: string;
  amount: number;
  redeemed_at: string;
}

const fetchValidatedVouchers = async (): Promise<ValidatedVoucher[]> => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('id, amount, redeemed_at')
    .eq('status', 'redeemed')
    .order('redeemed_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data || [];
};

const AdminValidateTicketPage = () => {
  const queryClient = useQueryClient();
  const [validationResult, setValidationResult] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { data: history, isLoading: isHistoryLoading } = useQuery<ValidatedVoucher[]>({
    queryKey: ['validatedVouchers'],
    queryFn: fetchValidatedVouchers,
  });

  const handleScanSuccess = async (token: string) => {
    setIsScanning(false);
    const loadingToast = showLoading("Vérification du ticket...");

    try {
      const { data, error } = await supabase.functions.invoke('validate-voucher', {
        body: { voucherToken: token },
      });

      dismissToast(loadingToast);

      if (error) {
        let errorMessage = "Erreur de validation.";
        try {
          const errorBody = await error.context.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error.includes('expired') ? 'Ticket expiré ou invalide.' : `Ticket déjà utilisé (${errorBody.error}).`;
          }
        } catch (e) {
          // Keep generic error
        }
        throw new Error(errorMessage);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        showSuccess("Ticket validé avec succès !");
        setValidationResult({ type: 'success', message: 'Ticket Valide', details: data.voucher });
        await queryClient.invalidateQueries({ queryKey: ['validatedVouchers'] });
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "Une erreur inconnue est survenue.");
      setValidationResult({ type: 'error', message: 'Ticket Invalide', details: { reason: err.message } });
    }
  };

  const resetScanner = () => {
    setValidationResult(null);
    setIsScanning(true);
    setCameraError(null);
  };

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/50 rounded-lg shadow-inner animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6">Valider un Ticket</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Scanner le QR Code</CardTitle>
            <CardDescription>Présentez le QR code du ticket devant la caméra.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
              {cameraError ? (
                <Alert variant="destructive" className="flex flex-col items-center text-center p-6">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <AlertTitle>Erreur de Caméra</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                  <Button onClick={resetScanner} className="mt-4">Réessayer</Button>
                </Alert>
              ) : isScanning ? (
                <QrCodeScanner
                  onScanSuccess={handleScanSuccess}
                  onCameraInitError={setCameraError}
                />
              ) : validationResult ? (
                <div className="text-center p-4">
                  {validationResult.type === 'success' ? (
                    <>
                      <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-500">{validationResult.message}</h3>
                      <p className="text-lg">Montant : <span className="font-bold">{validationResult.details.amount} €</span></p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-24 w-24 text-destructive mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-destructive">{validationResult.message}</h3>
                      <p className="text-muted-foreground">{validationResult.details.reason}</p>
                    </>
                  )}
                  <Button onClick={resetScanner} className="mt-6">
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scanner un autre ticket
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Historique des Validations</CardTitle>
            <CardDescription>Les 20 derniers tickets validés.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ID du Ticket</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHistoryLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  history?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.redeemed_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-mono text-xs">{item.id.substring(0, 8)}...</TableCell>
                      <TableCell className="text-right font-semibold">{item.amount.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminValidateTicketPage;