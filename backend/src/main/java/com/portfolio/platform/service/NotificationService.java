package com.portfolio.platform.service;

import com.portfolio.platform.model.Lead;

public interface NotificationService {

    /** Best-effort: a delivery failure is logged, never thrown — a lost email must not lose the lead. */
    void notifyNewLead(Lead lead);
}
