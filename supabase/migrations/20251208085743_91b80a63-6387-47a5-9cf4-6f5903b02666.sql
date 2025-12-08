
DO $$
DECLARE
  v_client_id UUID := '115fa51e-7667-4399-b1aa-843ae1dabdf3';
  v_branch_id UUID := '686ce665-f6ae-4283-9049-06450e480092';
  v_scheme_24 UUID := '37ea6b30-21e2-48d1-85e8-6d360e076f49';
  v_scheme_30 UUID := '2f45a672-7b15-4ff0-8c40-91773daacef9';
  v_scheme_36 UUID := '8b963993-45fd-4f7b-94f7-28bdb9020fe8';
  v_agent_id UUID := '2a783513-6c68-4139-9bc0-f0734e1e5c54';
  
  v_cust_ids UUID[];
  v_loan_ids UUID[];
  v_temp_id UUID;
  v_loan_number VARCHAR;
  v_receipt_number VARCHAR;
  v_redemption_number VARCHAR;
  v_principal NUMERIC;
  v_i INTEGER;
  
BEGIN
  -- PART 1: CREATE 30 NEW CUSTOMERS
  FOR v_i IN 1..30 LOOP
    INSERT INTO customers (
      client_id, branch_id, customer_code, full_name, phone, 
      address, city, state, pincode, gender, occupation
    ) VALUES (
      v_client_id, v_branch_id,
      'MOCK' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_i::TEXT, 4, '0'),
      CASE (v_i % 10)
        WHEN 1 THEN 'Rajesh Kumar ' || v_i
        WHEN 2 THEN 'Priya Sharma ' || v_i
        WHEN 3 THEN 'Anand Patel ' || v_i
        WHEN 4 THEN 'Lakshmi Devi ' || v_i
        WHEN 5 THEN 'Suresh Reddy ' || v_i
        WHEN 6 THEN 'Kavitha Nair ' || v_i
        WHEN 7 THEN 'Venkatesh Rao ' || v_i
        WHEN 8 THEN 'Meena Kumari ' || v_i
        WHEN 9 THEN 'Arjun Singh ' || v_i
        ELSE 'Deepa Menon ' || v_i
      END,
      '98' || LPAD((v_i * 111)::TEXT, 8, '0'),
      v_i::TEXT || ', Main Street, Ward ' || (v_i % 10 + 1)::TEXT,
      CASE (v_i % 5) WHEN 0 THEN 'Chennai' WHEN 1 THEN 'Madurai' WHEN 2 THEN 'Coimbatore' WHEN 3 THEN 'Salem' ELSE 'Trichy' END,
      'Tamil Nadu',
      '6' || LPAD((v_i * 1000)::TEXT, 5, '0'),
      CASE WHEN v_i % 2 = 0 THEN 'female'::gender_type ELSE 'male'::gender_type END,
      CASE (v_i % 6) WHEN 0 THEN 'Business' WHEN 1 THEN 'Agriculture' WHEN 2 THEN 'Salaried' WHEN 3 THEN 'Self-Employed' WHEN 4 THEN 'Retired' ELSE 'Homemaker' END
    ) RETURNING id INTO v_temp_id;
    v_cust_ids := array_append(v_cust_ids, v_temp_id);
  END LOOP;

  -- PART 2: CREATE 55 LOANS
  FOR v_i IN 1..55 LOOP
    v_loan_number := 'MOCK-L' || TO_CHAR(CURRENT_DATE, 'YYMM') || '/' || LPAD(v_i::TEXT, 5, '0');
    
    IF v_i <= 15 THEN v_principal := 25000 + (v_i * 5000);
    ELSIF v_i <= 35 THEN v_principal := 100000 + (v_i * 10000);
    ELSE v_principal := 500000 + (v_i * 5000);
    END IF;
    
    INSERT INTO loans (
      client_id, branch_id, customer_id, scheme_id, loan_number, loan_date, 
      principal_amount, shown_principal, actual_principal, interest_rate, 
      tenure_days, maturity_date, processing_fee, document_charges, net_disbursed, 
      status, agent_id, advance_interest_shown, advance_interest_actual, disbursement_mode,
      last_interest_paid_date, next_interest_due_date
    ) VALUES (
      v_client_id, v_branch_id, v_cust_ids[1 + (v_i % 30)],
      CASE (v_i % 3) WHEN 0 THEN v_scheme_24 WHEN 1 THEN v_scheme_30 ELSE v_scheme_36 END,
      v_loan_number,
      CASE WHEN v_i <= 10 THEN '2025-10-01'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-11-01'::DATE + ((v_i - 10) * 2) ELSE '2025-12-01'::DATE + ((v_i - 25) % 8) END,
      v_principal, v_principal, v_principal,
      CASE (v_i % 3) WHEN 0 THEN 2.00 WHEN 1 THEN 2.50 ELSE 3.00 END,
      365,
      CASE WHEN v_i <= 10 THEN '2026-10-01'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2026-11-01'::DATE + ((v_i - 10) * 2) ELSE '2026-12-01'::DATE + ((v_i - 25) % 8) END,
      CASE WHEN v_i % 3 = 0 THEN v_principal * 0.01 ELSE 0 END,
      CASE WHEN v_i % 4 = 0 THEN 100 + (v_i * 10) ELSE 0 END,
      v_principal - CASE WHEN v_i % 3 = 0 THEN v_principal * 0.01 ELSE 0 END - CASE WHEN v_i % 4 = 0 THEN 100 + (v_i * 10) ELSE 0 END,
      'active', CASE WHEN v_i % 3 = 0 THEN v_agent_id ELSE NULL END, 0, 0, 'cash',
      CASE WHEN v_i <= 10 THEN '2025-10-01'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-11-01'::DATE + ((v_i - 10) * 2) ELSE NULL END,
      CASE WHEN v_i <= 10 THEN '2025-11-01'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-12-01'::DATE + ((v_i - 10) * 2) ELSE '2026-01-01'::DATE + ((v_i - 25) % 8) END
    ) RETURNING id INTO v_temp_id;
    
    v_loan_ids := array_append(v_loan_ids, v_temp_id);
    
    -- Gold items with correct enum values: 24k, 22k, 20k, 18k, 14k
    INSERT INTO gold_items (loan_id, item_type, purity, purity_percentage, gross_weight_grams, stone_weight_grams, net_weight_grams, market_rate_per_gram, appraised_value)
    VALUES (
      v_temp_id,
      CASE (v_i % 5) WHEN 0 THEN 'Chain' WHEN 1 THEN 'Bangle' WHEN 2 THEN 'Ring' WHEN 3 THEN 'Earring' ELSE 'Necklace' END,
      CASE (v_i % 3) WHEN 0 THEN '22k'::gold_purity WHEN 1 THEN '18k'::gold_purity ELSE '24k'::gold_purity END,
      CASE (v_i % 3) WHEN 0 THEN 91.67 WHEN 1 THEN 75.00 ELSE 99.50 END,
      v_principal / 7500 + 5, CASE WHEN v_i % 4 = 0 THEN 0.5 ELSE 0 END,
      v_principal / 7500 + 5 - CASE WHEN v_i % 4 = 0 THEN 0.5 ELSE 0 END, 7500, v_principal * 1.2
    );
    
    INSERT INTO loan_disbursements (loan_id, amount, payment_mode, source_type)
    VALUES (v_temp_id, v_principal - CASE WHEN v_i % 3 = 0 THEN v_principal * 0.01 ELSE 0 END - CASE WHEN v_i % 4 = 0 THEN 100 + (v_i * 10) ELSE 0 END, 'cash', 'cash');
    
    IF v_i % 3 = 0 THEN
      INSERT INTO agent_commissions (client_id, branch_id, loan_id, agent_id, loan_principal, commission_percentage, commission_amount, status)
      VALUES (v_client_id, v_branch_id, v_temp_id, v_agent_id, v_principal, 1.00, v_principal * 0.01, 'pending');
    END IF;
  END LOOP;

  -- PART 3: CREATE 45 INTEREST PAYMENTS
  FOR v_i IN 1..45 LOOP
    v_receipt_number := 'MOCK-RCP' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_i::TEXT, 5, '0');
    SELECT principal_amount INTO v_principal FROM loans WHERE id = v_loan_ids[1 + (v_i % 25)];
    
    INSERT INTO interest_payments (client_id, branch_id, loan_id, receipt_number, payment_date, period_from, period_to, days_covered, shown_interest, actual_interest, amount_paid, penalty_amount, overdue_days, principal_reduction, payment_mode, source_type)
    VALUES (
      v_client_id, v_branch_id, v_loan_ids[1 + (v_i % 25)], v_receipt_number,
      CASE WHEN v_i <= 10 THEN '2025-10-15'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-11-15'::DATE + ((v_i - 10) * 2) ELSE '2025-12-05'::DATE + ((v_i - 25) % 10) END,
      CASE WHEN v_i <= 10 THEN '2025-10-01'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-11-01'::DATE + ((v_i - 10) * 2) ELSE '2025-12-01'::DATE END,
      CASE WHEN v_i <= 10 THEN '2025-10-15'::DATE + (v_i * 2) WHEN v_i <= 25 THEN '2025-11-15'::DATE + ((v_i - 10) * 2) ELSE '2025-12-05'::DATE + ((v_i - 25) % 10) END,
      30, v_principal * 0.015, v_principal * 0.025, v_principal * 0.025 + CASE WHEN v_i % 8 = 0 THEN 500 ELSE 0 END,
      CASE WHEN v_i % 8 = 0 THEN 500 ELSE 0 END, CASE WHEN v_i % 8 = 0 THEN 5 ELSE 0 END, CASE WHEN v_i % 10 = 0 THEN 5000 ELSE 0 END, 'cash', 'cash'
    );
  END LOOP;

  -- PART 4: CREATE 15 REDEMPTIONS
  FOR v_i IN 1..15 LOOP
    v_redemption_number := 'MOCK-RED' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(v_i::TEXT, 5, '0');
    SELECT principal_amount INTO v_principal FROM loans WHERE id = v_loan_ids[30 + v_i];
    
    UPDATE loans SET status = 'closed'::loan_status, closure_type = 'redeemed'::closure_type, closed_date = CASE WHEN v_i <= 5 THEN '2025-11-15'::DATE + (v_i * 2) ELSE '2025-12-05'::DATE + (v_i % 10) END WHERE id = v_loan_ids[30 + v_i];
    
    INSERT INTO redemptions (client_id, branch_id, loan_id, redemption_number, redemption_date, outstanding_principal, interest_due, penalty_amount, rebate_amount, total_settlement, amount_received, payment_mode, source_type, gold_released, identity_verified)
    VALUES (
      v_client_id, v_branch_id, v_loan_ids[30 + v_i], v_redemption_number,
      CASE WHEN v_i <= 5 THEN '2025-11-15'::DATE + (v_i * 2) ELSE '2025-12-05'::DATE + (v_i % 10) END,
      v_principal, v_principal * 0.025, CASE WHEN v_i % 4 = 0 THEN 1000 ELSE 0 END, CASE WHEN v_i % 5 = 0 THEN 500 ELSE 0 END,
      v_principal + (v_principal * 0.025) + CASE WHEN v_i % 4 = 0 THEN 1000 ELSE 0 END - CASE WHEN v_i % 5 = 0 THEN 500 ELSE 0 END,
      v_principal + (v_principal * 0.025) + CASE WHEN v_i % 4 = 0 THEN 1000 ELSE 0 END - CASE WHEN v_i % 5 = 0 THEN 500 ELSE 0 END,
      'cash', 'cash', true, true
    );
  END LOOP;

  -- PART 5: 3 AUCTIONS
  SELECT principal_amount INTO v_principal FROM loans WHERE id = v_loan_ids[46];
  UPDATE loans SET status = 'closed'::loan_status, closure_type = 'auctioned'::closure_type, closed_date = '2025-12-01' WHERE id = v_loan_ids[46];
  INSERT INTO auctions (client_id, branch_id, loan_id, auction_lot_number, auction_date, outstanding_principal, outstanding_interest, outstanding_penalty, total_outstanding, total_gold_weight_grams, total_appraised_value, reserve_price, sold_price, surplus_amount, shortfall_amount, status, buyer_name, buyer_contact, payment_mode, source_type, gold_verified, customer_notified)
  VALUES (v_client_id, v_branch_id, v_loan_ids[46], 'MOCK-AUC-001', '2025-12-01', v_principal, v_principal * 0.025, 1000, v_principal + v_principal * 0.025 + 1000, v_principal / 7500 + 5, v_principal * 1.2, v_principal * 1.1, v_principal + v_principal * 0.025 + 1000 + 50000, 50000, 0, 'sold', 'Buyer One', '9876543210', 'cash', 'cash', true, true);

  SELECT principal_amount INTO v_principal FROM loans WHERE id = v_loan_ids[47];
  UPDATE loans SET status = 'closed'::loan_status, closure_type = 'auctioned'::closure_type, closed_date = '2025-12-02' WHERE id = v_loan_ids[47];
  INSERT INTO auctions (client_id, branch_id, loan_id, auction_lot_number, auction_date, outstanding_principal, outstanding_interest, outstanding_penalty, total_outstanding, total_gold_weight_grams, total_appraised_value, reserve_price, sold_price, surplus_amount, shortfall_amount, status, buyer_name, buyer_contact, payment_mode, source_type, gold_verified, customer_notified)
  VALUES (v_client_id, v_branch_id, v_loan_ids[47], 'MOCK-AUC-002', '2025-12-02', v_principal, v_principal * 0.025, 2000, v_principal + v_principal * 0.025 + 2000, v_principal / 7500 + 5, v_principal * 1.2, v_principal * 0.95, v_principal - 30000, 0, 30000 + v_principal * 0.025 + 2000, 'sold', 'Buyer Two', '9876543211', 'cash', 'cash', true, true);

  SELECT principal_amount INTO v_principal FROM loans WHERE id = v_loan_ids[48];
  UPDATE loans SET status = 'closed'::loan_status, closure_type = 'auctioned'::closure_type, closed_date = '2025-12-03' WHERE id = v_loan_ids[48];
  INSERT INTO auctions (client_id, branch_id, loan_id, auction_lot_number, auction_date, outstanding_principal, outstanding_interest, outstanding_penalty, total_outstanding, total_gold_weight_grams, total_appraised_value, reserve_price, sold_price, surplus_amount, shortfall_amount, status, buyer_name, buyer_contact, payment_mode, source_type, gold_verified, customer_notified)
  VALUES (v_client_id, v_branch_id, v_loan_ids[48], 'MOCK-AUC-003', '2025-12-03', v_principal, v_principal * 0.025, 0, v_principal + v_principal * 0.025, v_principal / 7500 + 5, v_principal * 1.2, v_principal + v_principal * 0.025, v_principal + v_principal * 0.025, 0, 0, 'sold', 'Buyer Three', '9876543212', 'cash', 'cash', true, true);

  -- PART 6: SET OPENING BALANCES
  UPDATE accounts SET opening_balance = 5000000, current_balance = 5000000 WHERE client_id = v_client_id AND account_code = 'CASH-001';
  UPDATE accounts SET opening_balance = 5000000, current_balance = 5000000 WHERE client_id = v_client_id AND account_code = 'CAPITAL';
END $$;
