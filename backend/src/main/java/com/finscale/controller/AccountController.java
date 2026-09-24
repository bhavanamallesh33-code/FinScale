package com.finscale.controller;

import com.finscale.dto.AccountDTO;
import com.finscale.dto.CreateAccountDTO;
import com.finscale.dto.TransactionDTO;
import com.finscale.dto.TransactionResultDTO;
import com.finscale.dto.WithdrawRequestDTO;
import com.finscale.dto.DepositRequestDTO;
import com.finscale.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<AccountDTO>> getAllAccounts() {
        List<AccountDTO> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccountById(@PathVariable String id) {
        AccountDTO account = accountService.getAccountById(id);
        return ResponseEntity.ok(account);
    }

    @PostMapping
    public ResponseEntity<AccountDTO> createAccount(@Valid @RequestBody CreateAccountDTO dto) {
        AccountDTO created = accountService.createAccount(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<TransactionResultDTO> withdraw(
            @PathVariable String id,
            @Valid @RequestBody WithdrawRequestDTO request) {
        TransactionResultDTO result = accountService.withdraw(
                id,
                request.getAmount(),
                request.getDescription()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<TransactionResultDTO> deposit(
            @PathVariable String id,
            @Valid @RequestBody DepositRequestDTO request) {
        TransactionResultDTO result = accountService.deposit(
                id,
                request.getAmount(),
                request.getDescription()
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<TransactionDTO>> getTransactions(@PathVariable String id) {
        List<TransactionDTO> transactions = accountService.getTransactionsByAccountId(id);
        return ResponseEntity.ok(transactions);
    }
}
