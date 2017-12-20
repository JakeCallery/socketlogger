import logging
import sys


class SocketLogger:
    def __init__(self, logger_name=__name__, log_level=logging.DEBUG):
        self.log_level = log_level
        self.logger = self.create_logger(logger_name)
        self.logger.setLevel(log_level)
        self.enabled = True

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

