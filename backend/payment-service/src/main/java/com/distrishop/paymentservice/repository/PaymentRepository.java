package com.distrishop.paymentservice.repository;

import com.distrishop.paymentservice.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderId(Long orderId);

    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Check if a successful payment already exists for an order (idempotency check).
     */
    boolean existsByOrderIdAndStatus(Long orderId, Payment.PaymentStatus status);
}
