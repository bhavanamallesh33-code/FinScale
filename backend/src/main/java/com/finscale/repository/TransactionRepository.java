package com.finscale.repository;

import com.finscale.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByAccountIdOrderByCreatedAtDesc(String accountId);

    List<Transaction> findByAccountIdAndTypeAndStatus(String accountId, String type, String status);
}
