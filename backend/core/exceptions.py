from rest_framework.exceptions import APIException
from rest_framework import status


class ServiceUnavailable(APIException):
    """
    Exception raised when a service is unavailable.
    """
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Service temporarily unavailable, please try again later.'
    default_code = 'service_unavailable'


class BadRequest(APIException):
    """
    Exception raised for bad requests.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Bad request.'
    default_code = 'bad_request'


class Unauthorized(APIException):
    """
    Exception raised for unauthorized access.
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Unauthorized access.'
    default_code = 'unauthorized'


class Forbidden(APIException):
    """
    Exception raised for forbidden access.
    """
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Forbidden access.'
    default_code = 'forbidden'


class NotFound(APIException):
    """
    Exception raised when a resource is not found.
    """
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class Conflict(APIException):
    """
    Exception raised when there's a conflict in the request.
    """
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflict in request.'
    default_code = 'conflict'


class UnprocessableEntity(APIException):
    """
    Exception raised when the entity is unprocessable.
    """
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Unprocessable entity.'
    default_code = 'unprocessable_entity'


class RateLimitExceeded(APIException):
    """
    Exception raised when rate limit is exceeded.
    """
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded.'
    default_code = 'rate_limit_exceeded'


class AppealSubmissionError(Exception):
    """
    Custom exception for appeal submission errors.
    """
    def __init__(self, message="Error occurred while submitting appeal", code="appeal_submission_error"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotificationError(Exception):
    """
    Custom exception for notification errors.
    """
    def __init__(self, message="Error occurred while sending notification", code="notification_error"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class OpenAIError(Exception):
    """
    Custom exception for OpenAI API errors.
    """
    def __init__(self, message="Error occurred with OpenAI API", code="openai_error"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class DuplicateResourceError(APIException):
    """
    Exception raised when trying to create a duplicate resource.
    """
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource already exists.'
    default_code = 'duplicate_resource'