package com.foodhub.platform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class AdminDashboardWebSocketConfig implements WebSocketConfigurer {

    private final AdminDashboardWebSocketHandler adminDashboardWebSocketHandler;
    private final AdminDashboardWebSocketAuthInterceptor adminDashboardWebSocketAuthInterceptor;

    public AdminDashboardWebSocketConfig(AdminDashboardWebSocketHandler adminDashboardWebSocketHandler,
                                         AdminDashboardWebSocketAuthInterceptor adminDashboardWebSocketAuthInterceptor) {
        this.adminDashboardWebSocketHandler = adminDashboardWebSocketHandler;
        this.adminDashboardWebSocketAuthInterceptor = adminDashboardWebSocketAuthInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(adminDashboardWebSocketHandler, "/ws/admin-dashboard")
                .addInterceptors(adminDashboardWebSocketAuthInterceptor)
                .setAllowedOrigins("http://localhost:3000", "http://127.0.0.1:3000");
    }
}
