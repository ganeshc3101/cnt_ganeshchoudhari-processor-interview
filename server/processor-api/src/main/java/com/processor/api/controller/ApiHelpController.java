package com.processor.api.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/**
 * Serves a static HTML help page for local development at {@code /} and {@code /help}.
 * No framework-specific docs—just routes, auth, and curl samples.
 */
@RestController
public class ApiHelpController {

    private final String helpHtml;

    public ApiHelpController() {
        this.helpHtml = loadHelpHtml();
    }

    private static String loadHelpHtml() {
        try (var in = new ClassPathResource("api-help.html").getInputStream()) {
            return StreamUtils.copyToString(in, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("api-help.html missing on classpath", e);
        }
    }

    @GetMapping(value = {"/", "/help"}, produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> help() {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "html", StandardCharsets.UTF_8))
                .cacheControl(CacheControl.maxAge(0, TimeUnit.SECONDS).cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .body(helpHtml);
    }
}
