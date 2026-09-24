package com.finscale.config;

import com.finscale.model.Account;
import com.finscale.model.Transaction;
import com.finscale.repository.AccountRepository;
import com.finscale.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(AccountRepository accountRepository,
                               TransactionRepository transactionRepository) {
        return args -> {
            if (accountRepository.count() == 0) {
                Account account = new Account();
                account.setName("Operations Server Fund");
                account.setBalance(new BigDecimal("50000.00"));
                account.setCurrency("USD");
                Account saved = accountRepository.save(account);

                Transaction initialTxn = new Transaction();
                initialTxn.setAccountId(saved.getId());
                initialTxn.setType("deposit");
                initialTxn.setAmount(new BigDecimal("50000.00"));
                initialTxn.setStatus("completed");
                initialTxn.setDescription("Initial server fund allocation");
                initialTxn.setBalanceAfter(new BigDecimal("50000.00"));
                transactionRepository.save(initialTxn);
            }
        };
    }
}
