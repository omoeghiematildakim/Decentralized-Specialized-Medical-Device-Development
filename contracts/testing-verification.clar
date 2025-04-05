;; Testing Verification Contract
;; This contract records laboratory and clinical trial results

(define-data-var admin principal tx-sender)

;; Data structure for test records
(define-map test-records
  { test-id: (string-ascii 36) }
  {
    design-id: (string-ascii 36),
    test-type: (string-utf8 50),
    description: (string-utf8 500),
    results: (string-utf8 1000),
    results-hash: (buff 32),
    test-date: uint,
    verified: bool,
    verifier: (optional principal),
    verification-date: (optional uint)
  }
)

;; Public function to register a test record
(define-public (register-test
    (test-id (string-ascii 36))
    (design-id (string-ascii 36))
    (test-type (string-utf8 50))
    (description (string-utf8 500))
    (results (string-utf8 1000))
    (results-hash (buff 32)))
  (begin
    (asserts! (is-none (map-get? test-records { test-id: test-id })) (err u1))
    (ok (map-set test-records
      { test-id: test-id }
      {
        design-id: design-id,
        test-type: test-type,
        description: description,
        results: results,
        results-hash: results-hash,
        test-date: block-height,
        verified: false,
        verifier: none,
        verification-date: none
      }
    ))
  )
)

;; Admin function to verify a test record
(define-public (verify-test (test-id (string-ascii 36)))
  (begin
    (asserts! (is-some (map-get? test-records { test-id: test-id })) (err u2))
    (ok (map-set test-records
      { test-id: test-id }
      (merge (unwrap-panic (map-get? test-records { test-id: test-id }))
        {
          verified: true,
          verifier: (some tx-sender),
          verification-date: (some block-height)
        }
      )
    ))
  )
)

;; Read-only function to get test details
(define-read-only (get-test-details (test-id (string-ascii 36)))
  (map-get? test-records { test-id: test-id })
)

;; Read-only function to check if a test is verified
(define-read-only (is-verified-test (test-id (string-ascii 36)))
  (match (map-get? test-records { test-id: test-id })
    test (ok (get verified test))
    (err u3)
  )
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u5))
    (ok (var-set admin new-admin))
  )
)
