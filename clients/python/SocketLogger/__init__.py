import logging
import sys
import socket
import atexit


class SocketHandler(logging.Handler):
    def __init__(self, socket_logger):
        super(SocketHandler, self).__init__()
        self.socket_logger = socket_logger

        # Gentle socket close on exit
        atexit.register(self.socket_logger.close_socket_logger)

    def emit(self, record):
        log_entry = self.format(record)
        log_entry = log_entry + "\\n"
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
        self.remaining_socket_connect_retries = -1
        self.log_entry_buffer = []

    def log(self, message=""):
        self.logger.log(logging.INFO, message)

    def info(self, message=""):
        self.logger.log(logging.INFO, message)

    def debug(self, message=""):
        self.logger.log(logging.DEBUG, message)

    def error(self, message=""):
        self.logger.log(logging.ERROR, message)

    def warning(self, message=""):
        self.logger.log(logging.WARNING, message)

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

    def add_socket_logger(self, host, port, connection_retries=-1):
        self.remote_host = host
        self.remote_port = port
        self.remaining_socket_connect_retries = connection_retries
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
            print("ERROR: Failed to create Socket: " + str(e))

            # Bail, will try reconnecting on next message send
            return

        try:
            remote_ip = socket.gethostbyname(host)
        except socket.gaierror as e:
            print("ERROR: Hostname could not be resolved: " + str(e))

            # Bail, will try reconnecting on next message send
            return

        try:
            s.connect((remote_ip, port))

            if len(self.log_entry_buffer) > 0:
                for entry in self.log_entry_buffer:
                    self.send_log_entry(entry)

        except Exception as e:
            print("ERROR: Could not connect: " + str(e))
            if not is_reconnect_attempt:
                print("Will Attempt a reconnect...")
                self.reconnect_socket(self.remote_host, self.remote_port)

    def reconnect_socket(self, host, port):
        print ("Attempting Reconnect...")
        self.connect_socket(host, port, True)

    def close_socket_logger(self):
        print("Closing Socket Logger...")
        if self.log_socket is not None:
            try:
                self.log_socket.shutdown(socket.SHUT_RDWR)
                self.log_socket.close()
            except Exception as e:
                print("ERROR: Could Not Close Socket: " + str(e))

    def send_log_entry(self, log_entry):
            total_sent = 0
            while total_sent < len(log_entry):
                try:
                    sent = self.log_socket.send(str(log_entry)[total_sent:].encode('utf-8'))
                except socket.error as se:
                    print("ERROR: Could not send: " + str(se))
                    print("Buffering Message...")
                    self.log_entry_buffer.append(log_entry)
                    print("Total Buffered Messages: " + str(len(self.log_entry_buffer)))

                    # Attempt a new connection
                    self.reconnect_socket(self.remote_host, self.remote_port)
                    break

                if sent == 0:
                    raise RuntimeError("Socket Connection Broken")

                # Update sent count
                total_sent = total_sent + sent

                # Debugging only
                # if sent != len(log_entry):
                #     print("!!!! Partial Message Sent: " + str(sent) + "/" + str(total_sent) + "/" + str(len(log_entry)))

