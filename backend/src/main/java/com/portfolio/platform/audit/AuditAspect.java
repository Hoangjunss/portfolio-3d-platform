package com.portfolio.platform.audit;

import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.User;
import com.portfolio.platform.user.UserRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditAspect(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Around("@annotation(audited)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Object result = joinPoint.proceed();
        // Only a completed call is audited: a method that threw did not change anything worth a row.

        Long entityId = (result instanceof Long id) ? id : null;

        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        String ipAddress = null;
        if (requestAttributes instanceof ServletRequestAttributes servletRequestAttributes) {
            ipAddress = servletRequestAttributes.getRequest().getRemoteAddr();
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            // JwtAuthFilter sets the principal to the username String, not a user ID;
            // look up the User by username to resolve the primary key.
            userId = userRepository.findByUsername(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        }

        AuditLog log = new AuditLog();
        log.setEntityType(audited.entityType());
        log.setAction(audited.action());
        log.setEntityId(entityId);
        log.setUserId(userId);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);

        return result;
    }
}
