;; Inventor Verification Contract
;; This contract validates the credentials of medical innovators

(define-data-var admin principal tx-sender)

;; Data structure for inventor credentials
(define-map inventors
  { inventor-id: (string-ascii 36) }
  {
    principal: principal,
    name: (string-utf8 100),
    credentials: (string-utf8 500),
    specialization: (string-utf8 100),
    verified: bool,
    verification-date: uint
  }
)

;; Public function to register as an inventor
(define-public (register-inventor
    (inventor-id (string-ascii 36))
    (name (string-utf8 100))
    (credentials (string-utf8 500))
    (specialization (string-utf8 100)))
  (begin
    (asserts! (is-none (map-get? inventors { inventor-id: inventor-id })) (err u1))
    (ok (map-set inventors
      { inventor-id: inventor-id }
      {
        principal: tx-sender,
        name: name,
        credentials: credentials,
        specialization: specialization,
        verified: false,
        verification-date: u0
      }
    ))
  )
)

;; Admin function to verify an inventor
(define-public (verify-inventor (inventor-id (string-ascii 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u2))
    (asserts! (is-some (map-get? inventors { inventor-id: inventor-id })) (err u3))
    (ok (map-set inventors
      { inventor-id: inventor-id }
      (merge (unwrap-panic (map-get? inventors { inventor-id: inventor-id }))
        {
          verified: true,
          verification-date: block-height
        }
      )
    ))
  )
)

;; Read-only function to check if an inventor is verified
(define-read-only (is-verified-inventor (inventor-id (string-ascii 36)))
  (match (map-get? inventors { inventor-id: inventor-id })
    inventor (ok (get verified inventor))
    (err u4)
  )
)

;; Read-only function to get inventor details
(define-read-only (get-inventor-details (inventor-id (string-ascii 36)))
  (map-get? inventors { inventor-id: inventor-id })
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u5))
    (ok (var-set admin new-admin))
  )
)
