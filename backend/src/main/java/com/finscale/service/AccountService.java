package com.finscale.service;

import com.finscale.dto.AccountDTO;
import com.finscale.dto.CreateAccountDTO;
import com.finscale.dto.TransactionDTO;
import com.finscale.dto.TransactionResultDTO;
import com.finscale.exception.InsufficientBalanceException;
import com.finscale.exception.InvalidTransactionException;
import com.finscale.exception.ResourceNotFoundException;
import com.finscale.model.Account;
import com.finscale.model.Transaction;
import com.finscale.repository.AccountRepository;
import com.finscale.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public AccountService(AccountRepository accountRepository,
                          TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<AccountDTO> getAllAccounts() {
        return accountRepository.findAll()
                .stream()
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MAX;
                    LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MAX;
                    return aTime.compareTo(bTime);
                })
                .map(this::toAccountDTO)
                .collect(Collectors.toList());
    }

    public AccountDTO getAccountById(String id) {
        Account account = findAccountOrThrow(id);
        return toAccountDTO(account);
    }

    public AccountDTO createAccount(CreateAccountDTO dto) {
        BigDecimal initialBalance = dto.getInitialBalance() != null ? dto.getInitialBalance() : BigDecimal.ZERO;
        String currency = dto.getCurrency() != null && !dto.getCurrency().isBlank() ? dto.getCurrency() : "USD";

        Account account = new Account();
        account.setName(dto.getName());
        account.setBalance(initialBalance);
        account.setCurrency(currency);

        Account saved = accountRepository.save(account);

        if (initialBalance.compareTo(BigDecimal.ZERO) > 0) {
            Transaction initialTxn = new Transaction();
            initialTxn.setAccountId(saved.getId());
            initialTxn.setType("deposit");
            initialTxn.setAmount(initialBalance);
            initialTxn.setStatus("completed");
            initialTxn.setDescription("Initial deposit");
            initialTxn.setBalanceAfter(initialBalance);
            transactionRepository.save(initialTxn);
        }

        return toAccountDTO(saved);
    }

    public TransactionResultDTO withdraw(String accountId, BigDecimal amount, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Amount must be greater than zero.");
        }

        Account account = findAccountOrThrow(accountId);

        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Insufficient balance for this withdrawal.");
        }

        BigDecimal newBalance = account.getBalance().subtract(amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction txn = new Transaction();
        txn.setAccountId(accountId);
        txn.setType("withdrawal");
        txn.setAmount(amount);
        txn.setStatus("completed");
        txn.setDescription(description != null && !description.isBlank() ? description : "Withdrawal");
        txn.setBalanceAfter(newBalance);
        Transaction savedTxn = transactionRepository.save(txn);

        return TransactionResultDTO.builder()
                .transaction(toTransactionDTO(savedTxn))
                .newBalance(newBalance)
                .build();
    }

    public TransactionResultDTO deposit(String accountId, BigDecimal amount, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Amount must be greater than zero.");
        }

        Account account = findAccountOrThrow(accountId);

        BigDecimal newBalance = account.getBalance().add(amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction txn = new Transaction();
        txn.setAccountId(accountId);
        txn.setType("deposit");
        txn.setAmount(amount);
        txn.setStatus("completed");
        txn.setDescription(description != null && !description.isBlank() ? description : "Deposit");
        txn.setBalanceAfter(newBalance);
        Transaction savedTxn = transactionRepository.save(txn);

        return TransactionResultDTO.builder()
                .transaction(toTransactionDTO(savedTxn))
                .newBalance(newBalance)
                .build();
    }

    public List<TransactionDTO> getTransactionsByAccountId(String accountId) {
        findAccountOrThrow(accountId);
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(this::toTransactionDTO)
                .collect(Collectors.toList());
    }

    private Account findAccountOrThrow(String id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
    }

    private AccountDTO toAccountDTO(Account account) {
        return AccountDTO.builder()
                .id(account.getId())
                .name(account.getName())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }

    private TransactionDTO toTransactionDTO(Transaction txn) {
        return TransactionDTO.builder()
                .id(txn.getId())
                .accountId(txn.getAccountId())
                .type(txn.getType())
                .amount(txn.getAmount())
                .status(txn.getStatus())
                .description(txn.getDescription())
                .balanceAfter(txn.getBalanceAfter())
                .createdAt(txn.getCreatedAt())
                .build();
    }
}
