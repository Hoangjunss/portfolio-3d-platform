package com.portfolio.platform.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final String entityType;
    private final Long entityId;

    public ResourceNotFoundException(String entityType, Long entityId) {
        super(entityType + " not found with id: " + entityId);
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }
}
