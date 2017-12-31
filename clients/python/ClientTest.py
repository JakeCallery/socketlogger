from SocketLogger import SocketLogger

if __name__ == "__main__":
    logger = SocketLogger()
    logger.add_console_logger()
    #logger.add_file_logger("test.log")
    logger.add_socket_logger("localhost", 9000)
    logger.log("Logger Test")
    logger.log("Line 2")
    logger.log("This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line")
    logger.error("This is an ERROR")
    logger.warning("This is a WARNING")
    logger.debug("This is a DEBUG")
    logger.info("This is an INFO")
    logger.close_socket_logger()
