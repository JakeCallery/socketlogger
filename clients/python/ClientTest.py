from SocketLogger import SocketLogger

if __name__ == "__main__":
    logger = SocketLogger()
    logger.add_console_logger()
    #logger.add_file_logger("test.log")
    logger.add_socket_logger("localhost", 8999)
    logger.log("Logger Test")
    logger.close_socket_logger()
