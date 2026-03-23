package com.foodhub.platform.service;

import com.foodhub.platform.model.AuditLog;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final RequestMetadataService requestMetadataService;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           RequestMetadataService requestMetadataService) {
        this.auditLogRepository = auditLogRepository;
        this.requestMetadataService = requestMetadataService;
    }

    @Transactional
    public void log(String actorEmail,
                    UserRole actorRole,
                    String action,
                    String targetType,
                    String targetId,
                    String details) {
        AuditLog logEntry = new AuditLog();
        logEntry.setActorEmail(actorEmail == null || actorEmail.isBlank() ? "SYSTEM" : actorEmail);
        logEntry.setActorRole(actorRole == null ? UserRole.ADMIN : actorRole);
        logEntry.setAction(action);
        logEntry.setTargetType(targetType);
        logEntry.setTargetId(targetId);
        logEntry.setDetails(details);
        logEntry.setIpAddress(requestMetadataService.getClientIpAddress());
        auditLogRepository.save(logEntry);
    }
}
