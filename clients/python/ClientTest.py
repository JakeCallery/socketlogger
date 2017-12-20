from SocketLogger import SocketLogger

if __name__ == "__main__":
    logger = SocketLogger()
    logger.add_console_logger()
    #logger.add_file_logger("test.log")
    logger.log("Logger Test")
