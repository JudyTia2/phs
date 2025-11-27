import logging
import logging.config
import json

class JsonFormatter(logging.Formatter):
    """A very small JSON formatter without third-party libs."""
    def format(self, record):
        record_dict = record.__dict__.copy()

        # Remove non-serializable fields
        record_dict.pop('args', None)
        record_dict.pop('exc_info', None)

        return json.dumps(record_dict)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "json": {
            "()": JsonFormatter,
        }
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        }
    },

    "root": {
        "handlers": ["console"],
        "level": "INFO",
    }
}

def setup_logging():
    logging.config.dictConfig(LOGGING)
