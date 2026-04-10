from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re


def validate_phone_number(value):
    """
    Validate phone number format.
    Accepts formats like: +998901234567, 901234567, (90) 123-45-67, etc.
    """
    pattern = r'^(\+\d{1,3}[- ]?)?\d{9,15}$'
    if not re.match(pattern, value.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')):
        raise ValidationError(
            _('Enter a valid phone number.'),
            code='invalid_phone'
        )


def validate_national_id(value):
    """
    Validate national ID format.
    For this example, we'll assume a format of 8-9 alphanumeric characters.
    This should be adjusted based on the country's actual national ID format.
    """
    pattern = r'^[A-Z0-9]{8,10}$'
    if not re.match(pattern, value.upper()):
        raise ValidationError(
            _('Enter a valid national ID.'),
            code='invalid_national_id'
        )


def validate_postal_code(value):
    """
    Validate postal code format.
    For this example, we'll accept 4-6 digits.
    This should be adjusted based on the country's actual postal code format.
    """
    pattern = r'^\d{4,6}$'
    if not re.match(pattern, value):
        raise ValidationError(
            _('Enter a valid postal code.'),
            code='invalid_postal_code'
        )


def validate_citizen_document_number(value):
    """
    Validate citizen document number format.
    Accepts alphanumeric characters, typically 6-15 characters.
    """
    pattern = r'^[A-Z0-9]{6,15}$'
    if not re.match(pattern, value.upper()):
        raise ValidationError(
            _('Enter a valid document number.'),
            code='invalid_document_number'
        )


def validate_no_future_date(value):
    """
    Validate that the date is not in the future.
    """
    from django.utils import timezone
    if value and value > timezone.now().date():
        raise ValidationError(
            _('Date cannot be in the future.'),
            code='future_date'
        )


def validate_not_past_date(days_ahead=365):
    """
    Validate that the date is not too far in the past.
    By default, ensures date is not more than 1 year ago.
    """
    from django.utils import timezone
    cutoff_date = timezone.now().date() - timezone.timedelta(days=days_ahead)
    if value and value < cutoff_date:
        raise ValidationError(
            _('Date cannot be more than %(days)s days in the past.') % {'days': days_ahead},
            code='past_date'
        )


def validate_file_size(max_size_mb):
    """
    Validator factory to validate file size.
    max_size_mb: Maximum file size in megabytes.
    """
    def validator(value):
        filesize = value.size
        if filesize > max_size_mb * 1024 * 1024:
            raise ValidationError(
                _('File size cannot exceed %(size)s MB.') % {'size': max_size_mb},
                code='invalid_file_size'
            )
    return validator


def validate_file_extension(allowed_extensions):
    """
    Validator factory to validate file extensions.
    allowed_extensions: List of allowed extensions like ['.pdf', '.doc', '.jpg']
    """
    def validator(value):
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise ValidationError(
                _('File extension "%(ext)s" is not allowed. Allowed extensions are: %(allowed)s') % {
                    'ext': ext,
                    'allowed': ', '.join(allowed_extensions)
                },
                code='invalid_file_extension'
            )
    return validator