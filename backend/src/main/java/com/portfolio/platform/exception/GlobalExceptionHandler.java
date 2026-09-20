package com.portfolio.platform.exception;

import com.portfolio.platform.dto.ApiErrorDto;
import com.portfolio.platform.service.SystemErrorLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final SystemErrorLogService systemErrorLogService;

    public GlobalExceptionHandler(SystemErrorLogService systemErrorLogService) {
        this.systemErrorLogService = systemErrorLogService;
    }

    // Rethrown, not handled: @RestControllerAdvice sits inside the DispatcherServlet, so it sees
    // AccessDeniedException before ExceptionTranslationFilter does. Handling it here would turn
    // every 403 into a 500 and log a bogus system_error_logs row.
    @ExceptionHandler(AccessDeniedException.class)
    public void handleAccessDenied(AccessDeniedException ex) throws AccessDeniedException {
        throw ex;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDto> handleValidation(MethodArgumentNotValidException ex) {
        // 400 is the caller's fault, not a system fault — no system_error_logs row.
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getField)
                .distinct()
                .collect(Collectors.joining(", "));
        if (message.isBlank()) {
            message = "Validation failed";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("VALIDATION_FAILED", message, null));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorDto> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorDto("INVALID_CREDENTIALS", "Invalid credentials", null));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorDto> handleResourceNotFound(ResourceNotFoundException ex) {
        // 404 is the caller's fault, not a system fault — no system_error_logs row.
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorDto("NOT_FOUND", ex.getMessage(), null));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiErrorDto> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        // 404 is the caller's fault or unmapped route, not a system fault — no system_error_logs row.
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorDto("NOT_FOUND", "Resource not found", null));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorDto> handleInvalidRequest(InvalidRequestException ex) {
        // 400 is the caller's fault, not a system fault — no system_error_logs row.
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("VALIDATION_FAILED", ex.getMessage(), null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorDto> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        // Thrown by multipart parsing before the controller runs; still the caller's fault, so
        // it must not write a system_error_logs row either.
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiErrorDto("FILE_TOO_LARGE", "File size exceeds maximum limit", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDto> handleUnexpected(Exception ex, HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();
        systemErrorLogService.record(request.getRequestURI(), HttpStatus.INTERNAL_SERVER_ERROR.value(), ex, requestId);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorDto("INTERNAL_ERROR", "Something went wrong", requestId));
    }
}
