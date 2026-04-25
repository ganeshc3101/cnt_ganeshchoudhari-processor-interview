package com.processor.core.model;

/**
 * How a transaction entered the system.
 *
 * <ul>
 *   <li>{@link #BATCH}  — submitted via file upload (CSV / JSON / XML).</li>
 *   <li>{@link #MANUAL} — entered by a user through the manual-entry form.</li>
 * </ul>
 */
public enum TransactionSource {
    BATCH,
    MANUAL
}
