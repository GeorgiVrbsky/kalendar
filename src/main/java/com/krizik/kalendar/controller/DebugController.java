package com.krizik.kalendar.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@RestController
public class DebugController {

    @GetMapping("/api/debug/session")
    public Map<String, Object> debugSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false); // false = nevytvářet novou, jen číst existující
        Map<String, Object> result = new HashMap<>();

        if (session == null) {
            result.put("status", "No Session Found on Server");
            return result;
        }

        result.put("sessionId", session.getId());
        result.put("creationTime", session.getCreationTime());

        // Vypíšeme všechny atributy v Session
        Map<String, String> attributes = new HashMap<>();
        Enumeration<String> attributeNames = session.getAttributeNames();
        while (attributeNames.hasMoreElements()) {
            String name = attributeNames.nextElement();
            Object value = session.getAttribute(name);
            attributes.put(name, value.toString());
        }
        result.put("attributes", attributes);

        // Zkusíme najít Spring Security kontext
        Object securityContext = session.getAttribute("SPRING_SECURITY_CONTEXT");
        if (securityContext != null) {
            result.put("securityContextFound", true);
            result.put("authentication", ((SecurityContext) securityContext).getAuthentication());
        } else {
            result.put("securityContextFound", false);
            result.put("error", "Session existuje, ale uživatel v ní není uložen!");
        }

        return result;
    }
}