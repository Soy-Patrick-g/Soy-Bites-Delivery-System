package com.foodhub.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Service
public class AdminRealtimeService {

    private static final Logger log = LoggerFactory.getLogger(AdminRealtimeService.class);

    private final ObjectMapper objectMapper;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public AdminRealtimeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    public void unregister(WebSocketSession session) {
        sessions.remove(session.getId());
    }

    public void publish(String type, Object payload) {
        String message = toJson(new AdminRealtimeEvent(type, Instant.now(), payload));
        sessions.values().removeIf(session -> !session.isOpen());
        for (WebSocketSession session : sessions.values()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException exception) {
                log.warn("Unable to send admin realtime event {}: {}", type, exception.getMessage());
                sessions.remove(session.getId());
            }
        }
    }

    private String toJson(AdminRealtimeEvent event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to encode admin realtime event", exception);
        }
    }

    private record AdminRealtimeEvent(String type, Instant occurredAt, Object payload) {
    }
}
