package com.portfolio.platform.error;

import com.portfolio.platform.audit.SystemErrorLogRepository;
import com.portfolio.platform.dto.ApiErrorDto;
import com.portfolio.platform.model.SystemErrorLog;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final SystemErrorLogRepository systemErrorLogRepository;

    public GlobalExceptionHandler(SystemErrorLogRepository systemErrorLogRepository) {
        this.systemErrorLogRepository = systemErrorLogRepository;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDto> handleUnexpected(Exception ex, HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();

        String endpoint = request.getRequestURI();
        if (endpoint != null && endpoint.length() > 255) {
            endpoint = endpoint.substring(0, 255);
        }

        String exceptionClass = ex.getClass().getName();
        if (exceptionClass.length() > 255) {
            exceptionClass = exceptionClass.substring(0, 255);
        }

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        String stacktrace = sw.toString();

        SystemErrorLog log = new SystemErrorLog();
        log.setEndpoint(endpoint != null ? endpoint : "");
        log.setHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        log.setExceptionClass(exceptionClass);
        log.setMessage(ex.getMessage());
        log.setStacktrace(stacktrace);
        log.setRequestId(requestId);
        systemErrorLogRepository.save(log);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorDto("INTERNAL_ERROR", "Something went wrong", requestId));
    }
}
