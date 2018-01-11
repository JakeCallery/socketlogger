import logging
import sys
import socket
import atexit
from threading import Timer


class SocketHandler(logging.Handler):
    def __init__(self, socket_logger):
        super(SocketHandler, self).__init__()
        self.socket_logger = socket_logger

        # Gentle socket close on exit
        atexit.register(self.socket_logger.close_socket_logger)

    def emit(self, record):
        log_entry = self.format(record)
        print("Sending to Socket: " + str(log_entry))
        if self.socket_logger.log_socket is not None:
            self.socket_logger.send_log_entry(log_entry)
        else:
            print("Socket Logger Not Yet Ready, not sending log")


class SocketLogger:
    def __init__(self, logger_name=__name__, log_level=logging.DEBUG):
        self.log_level = log_level
        self.logger = self.create_logger(logger_name)
        self.logger.setLevel(log_level)
        self.enabled = True
        self.log_socket = None
        self.remote_host = None
        self.remote_port = None
        self.log_entry_buffer = []
        self.reconnect_timer = "Test"

    def log(self, message=""):
        self.logger.log(logging.INFO, message + "\\n")

    def info(self, message=""):
        self.logger.log(logging.INFO, message + "\\n")

    def debug(self, message=""):
        self.logger.log(logging.DEBUG, message + "\\n")

    def error(self, message=""):
        self.logger.log(logging.ERROR, message + "\\n")

    def warning(self, message=""):
        self.logger.log(logging.WARNING, message + "\\n")

    def create_logger(self, name=""):
        logger = logging.getLogger(name)
        return logger

    def add_console_logger(self):
        stdout_handler = logging.StreamHandler(sys.stdout)
        stdout_handler.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s: %(message)s"))
        stdout_handler.setLevel(self.log_level)
        self.logger.addHandler(stdout_handler)

    def add_file_logger(self, file_path):
        file_handler = logging.FileHandler(file_path)
        file_handler.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s: %(message)s"))
        file_handler.setLevel(self.log_level)
        self.logger.addHandler(file_handler)

    def add_socket_logger(self, host, port):
        print("Creating Socket...")
        self.remote_host = host
        self.remote_port = port
        self.connect_socket(self.remote_host, self.remote_port)

        #Set up log handler
        socket_handler = SocketHandler(self)
        socket_handler.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s: %(message)s"))
        socket_handler.setLevel(self.log_level)
        self.logger.addHandler(socket_handler)

    def connect_socket(self, host, port, is_reconnect_attempt=False):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.log_socket = s
        except socket.error as e:
            print("Failed to create Socket: " + str(e))
            sys.exit()

        print("Getting IP Address for: " + host)
        try:
            remote_ip = socket.gethostbyname(host)
        except socket.gaierror as e:
            print("Hostname could not be resolved: " + str(e))

            # TODO: Probably shouldn't straight up bail here
            sys.exit()

        print("Connecting to remote server: " + host + "(" + remote_ip + ")")
        try:
            s.connect((remote_ip, port))
        except Exception as e:
            print("--------- Could not connect: " + str(e) + "-------------")
            print("Will try again in 5 seconds")
            print("Timer: " + str(self.reconnect_timer))
            if self.reconnect_timer is None and is_reconnect_attempt is not True:
                self.reconnect_timer = Timer(5.0, self.reconnect_socket(self.remote_host, self.remote_port))
                self.reconnect_timer.start()
            else:
                print("Timer Already Running... waiting....")

    def reconnect_socket(self, host, port):
        self.connect_socket(host, port, True)

    def close_socket_logger(self):
        print("Closing Socket Logger...")
        if self.log_socket is not None:
            try:
                self.log_socket.shutdown(socket.SHUT_RDWR)
                self.log_socket.close()
            except Exception as e:
                print("Could Not Close Socket: " + str(e))

    def send_log_entry(self, log_entry):
            total_sent = 0
            while total_sent < len(log_entry):
                try:
                    sent = self.log_socket.send(str(log_entry)[total_sent:])
                except socket.error as se:
                    print("Could not send: " + str(se))
                    print("Buffering Message...")
                    self.log_entry_buffer.append(log_entry)
                    print("Total Buffered Messages: " + str(len(self.log_entry_buffer)))

                    # Start reconnect timer
                    break

                if sent == 0:
                    raise RuntimeError("Socket Connection Broken")

                total_sent = total_sent + sent

                if sent != len(log_entry):
                    print("!!!! Partial Message Sent: " + str(sent) + "/" + str(total_sent) + "/" + str(len(log_entry)))

