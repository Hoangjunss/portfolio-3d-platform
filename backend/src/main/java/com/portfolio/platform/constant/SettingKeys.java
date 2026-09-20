package com.portfolio.platform.constant;

import java.util.List;

public final class SettingKeys {
    public static final String SITE_TITLE = "site_title";
    public static final String SEO_META = "seo_meta";
    public static final String SOCIAL_LINKS = "social_links";
    public static final String CONTACT_EMAIL = "contact_email";

    public static final List<String> ALL = List.of(SITE_TITLE, SEO_META, SOCIAL_LINKS, CONTACT_EMAIL);

    private SettingKeys() {}
}
