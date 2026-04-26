package com.processor.api;

import com.processor.api.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class ProcessorApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcessorApiApplication.class, args);
    }
}
