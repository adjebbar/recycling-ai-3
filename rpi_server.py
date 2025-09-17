from flask import Flask, request, jsonify
import subprocess
import threading
import os

app = Flask(__name__)

# Define the path to your conveyor control script
CONVEYOR_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'rpi_conveyor_control.py')

@app.route('/conveyor', methods=['POST'])
def control_conveyor():
    data = request.get_json()
    result = data.get('result')

    if not result or result not in ['accepted', 'rejected']:
        return jsonify({"error": "Invalid result. Must be 'accepted' or 'rejected'."}), 400

    print(f"Received command for conveyor: {result}")

    # Run the conveyor control script in a separate thread
    # This prevents the HTTP request from timing out while the conveyor runs
    def run_script():
        try:
            # Use subprocess.run to execute the Python script
            # Pass the result as a command-line argument
            subprocess.run(['python3', CONVEYOR_SCRIPT_PATH, result], check=True)
            print(f"Conveyor script finished for result: {result}")
        except subprocess.CalledProcessError as e:
            print(f"Error running conveyor script: {e}")
        except Exception as e:
            print(f"Unexpected error in conveyor script thread: {e}")

    thread = threading.Thread(target=run_script)
    thread.start()

    return jsonify({"message": f"Conveyor command '{result}' received and processing."}), 200

if __name__ == '__main__':
    # Run the Flask app on all available network interfaces (0.0.0.0)
    # and on port 5000 (or any other port you prefer)
    # Ensure this port is open on your Raspberry Pi's firewall if applicable
    app.run(host='0.0.0.0', port=5000)