package com.processor.api.config;

import com.processor.core.repository.TransactionRepository;
import com.processor.core.service.ReportingService;
import com.processor.core.service.TransactionProcessorService;
import com.processor.core.validator.CardValidator;
import com.processor.core.parser.TransactionFileParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Wires pure-Java core components into the Spring context.
 * Core classes stay free of Spring annotations — instantiation happens here.
 */
@Configuration
public class AppConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public CardValidator cardValidator() {
        return new CardValidator();
    }

    @Bean
    public TransactionFileParser transactionFileParser() {
        return new TransactionFileParser();
    }

    @Bean
    public TransactionProcessorService transactionProcessorService(
            TransactionRepository transactionRepository,
            CardValidator cardValidator) {
        return new TransactionProcessorService(transactionRepository, cardValidator);
    }

    @Bean
    public ReportingService reportingService(TransactionRepository transactionRepository) {
        return new ReportingService(transactionRepository);
    }
}
