import logging

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        return True
