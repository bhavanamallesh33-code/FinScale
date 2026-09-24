package com.finscale.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;

    private String accountId;

    private String type;

    private BigDecimal amount;

    private String status;

    private String description;

    private BigDecimal balanceAfter;

    @CreatedDate
    private LocalDateTime createdAt;
}
