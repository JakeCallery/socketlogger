import logging
import sys
import socket


class SocketHandler(logging.Handler):
    def __init__(self, socket_logger):
        super(SocketHandler, self).__init__()
        self.socket_logger = socket_logger

    def emit(self, record):
        log_entry = self.format(record)
        print("Sending to Socket: " + str(log_entry))
        if self.socket_logger.log_socket is not None:
            total_sent = 0
            while total_sent < len(log_entry):
                try:
                    sent = self.socket_logger.log_socket.send(str(log_entry)[total_sent:])
                except socket.error as se:
                    print("Could not send: " + str(se))
                    break

                if sent == 0:
                    raise RuntimeError("Socket Connection Broken")

                total_sent = total_sent + sent

                if sent != len(log_entry):
                    print("Partial Message Sent: " + str(sent) + "/" + str(total_sent) + "/" + str(len(log_entry)))


class SocketLogger:
    def __init__(self, logger_name=__name__, log_level=logging.DEBUG):
        self.log_level = log_level
        self.logger = self.create_logger(logger_name)
        self.logger.setLevel(log_level)
        self.enabled = True
        self.log_socket = None

    def log(self, message=""):
        self.logger.log(logging.DEBUG, message)

    def create_logger(self, name=""):
        logger = logging.getLogger(name)
        return logger

    def add_console_logger(self):
        stdout_handler = logging.StreamHandler(sys.stdout)
        stdout_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        stdout_handler.setLevel(self.log_level)
        self.logger.addHandler(stdout_handler)

    def add_file_logger(self, file_path):
        file_handler = logging.FileHandler(file_path)
        file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        file_handler.setLevel(self.log_level)
        self.logger.addHandler(file_handler)

    def add_socket_logger(self, host, port):
        print("Creating Socket...")
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
            sys.exit()

        print("Connecting to remote server: " + host + "(" + remote_ip + ")")
        try:
            s.connect((remote_ip, port))
        except Exception as e:
            print("Could not connect: " + str(e))

        #Set up log handler
        socket_handler = SocketHandler(self)
        socket_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        socket_handler.setLevel(self.log_level)
        self.logger.addHandler(socket_handler)

