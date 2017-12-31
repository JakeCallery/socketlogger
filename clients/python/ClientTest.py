from SocketLogger import SocketLogger

if __name__ == "__main__":
    logger = SocketLogger()
    logger.add_console_logger()
    #logger.add_file_logger("test.log")
    logger.add_socket_logger("localhost", 8999)
    logger.log("Logger Test")
    logger.log("Line 2")
    logger.log("This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line")
    logger.log("Line 4")
    logger.log("Line 5")
    logger.close_socket_logger()
