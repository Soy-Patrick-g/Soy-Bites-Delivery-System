package com.foodhub.platform.config;

import com.foodhub.platform.service.AdminRealtimeService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class AdminDashboardWebSocketHandler extends TextWebSocketHandler {

    private final AdminRealtimeService adminRealtimeService;

    public AdminDashboardWebSocketHandler(AdminRealtimeService adminRealtimeService) {
        this.adminRealtimeService = adminRealtimeService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        adminRealtimeService.register(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        adminRealtimeService.unregister(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Server-push only.
    }
}
