import RPi.GPIO as GPIO
import time

# Define GPIO pins using BCM numbering
CONVEYOR_FORWARD_PIN = 17  # Corresponds to physical pin 11
CONVEYOR_BACKWARD_PIN = 27 # Corresponds to physical pin 13

def handleRecyclingResult(result: str):
    """
    Controls a conveyor belt on a Raspberry Pi based on a recycling result.

    Args:
        result (str): The recycling result, either "accepted" or "rejected".
    """
    try:
        # Set the GPIO mode to BCM (Broadcom SOC channel numbering)
        GPIO.setmode(GPIO.BCM)

        # Set up the GPIO pins as output
        GPIO.setup(CONVEYOR_FORWARD_PIN, GPIO.OUT)
        GPIO.setup(CONVEYOR_BACKWARD_PIN, GPIO.OUT)

        print(f"Processing result: {result}")

        if result == "accepted":
            print("Activating conveyor forward (GPIO17 HIGH for 2 seconds)...")
            GPIO.output(CONVEYOR_FORWARD_PIN, GPIO.HIGH)
            time.sleep(2) # Run for 2 seconds
            GPIO.output(CONVEYOR_FORWARD_PIN, GPIO.LOW)
            print("Conveyor forward stopped.")
        elif result == "rejected":
            print("Activating conveyor backward (GPIO27 HIGH for 2 seconds)...")
            GPIO.output(CONVEYOR_BACKWARD_PIN, GPIO.HIGH)
            time.sleep(2) # Run for 2 seconds
            GPIO.output(CONVEYOR_BACKWARD_PIN, GPIO.LOW)
            print("Conveyor backward stopped.")
        else:
            print(f"Unknown result: {result}. No action taken.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Always clean up GPIO settings to release the pins
        GPIO.cleanup()
        print("GPIO cleanup complete.")

if __name__ == "__main__":
    print("--- Testing handleRecyclingResult function ---")
    
    # Test with "accepted"
    handleRecyclingResult("accepted")
    time.sleep(3) # Wait a bit before the next test

    # Test with "rejected"
    handleRecyclingResult("rejected")
    time.sleep(3) # Wait a bit before the next test

    # Test with an unknown result
    handleRecyclingResult("unknown")

    print("--- Testing complete ---")