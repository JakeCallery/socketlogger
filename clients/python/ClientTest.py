import logging
from SocketLogger import SocketLogger

if __name__ == "__main__":
    logger = SocketLogger()
    #logger = SocketLogger("Neat Logger", log_level=logging.INFO)
    logger.add_console_logger()
    #logger.add_file_logger("test.log")

    
    logger.log("Logger Test")
    logger.log("Line 2")
    logger.log("This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line This is very long line")
    logger.error("This is an ERROR")
    logger.warning("This is a WARNING")
    logger.debug("This is a DEBUG")
    logger.info("This is an INFO")
    # raw_input("Press Enter To Continue After Stopping Server")
    # logger.info("After Wait")
    # raw_input("Press Enter To Continue after Restarting Server")
    # logger.info("Should auto reconnect")
