package com.foodhub.platform.config;

import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.service.JwtService;
import com.foodhub.platform.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class AdminDashboardWebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserSessionService userSessionService;

    public AdminDashboardWebSocketAuthInterceptor(JwtService jwtService, UserSessionService userSessionService) {
        this.jwtService = jwtService;
        this.userSessionService = userSessionService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        try {
            String token = extractToken(request);
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);
            String sessionId = jwtService.extractSessionId(token);

            if (username == null || role == null || sessionId == null || !jwtService.isTokenValid(token)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin session");
            }
            if (!UserRole.ADMIN.name().equalsIgnoreCase(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
            }
            if (!userSessionService.validateAndTouch(sessionId, username)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin session has expired");
            }

            attributes.put("adminEmail", username);
            return true;
        } catch (ResponseStatusException exception) {
            response.setStatusCode(exception.getStatusCode());
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
    }

    private String extractToken(ServerHttpRequest request) {
        List<String> authorizationHeaders = request.getHeaders().get("Authorization");
        if (authorizationHeaders != null) {
            for (String authorizationHeader : authorizationHeaders) {
                if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                    return authorizationHeader.substring(7);
                }
            }
        }

        URI uri = request.getURI();
        String query = uri.getQuery();
        if (query != null) {
            for (String pair : query.split("&")) {
                String[] parts = pair.split("=", 2);
                if (parts.length == 2 && "token".equals(parts[0]) && !parts[1].isBlank()) {
                    return parts[1];
                }
            }
        }

        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest nativeRequest = servletRequest.getServletRequest();
            String token = nativeRequest.getParameter("token");
            if (token != null && !token.isBlank()) {
                return token;
            }
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin session token is required");
    }
}
