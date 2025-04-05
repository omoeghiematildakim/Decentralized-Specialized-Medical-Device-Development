;; Regulatory Submission Contract
;; This contract tracks the approval process with regulatory authorities

(define-data-var admin principal tx-sender)

;; Enum for submission status
(define-constant STATUS_SUBMITTED u1)
(define-constant STATUS_UNDER_REVIEW u2)
(define-constant STATUS_ADDITIONAL_INFO_REQUESTED u3)
(define-constant STATUS_APPROVED u4)
(define-constant STATUS_REJECTED u5)

;; Data structure for regulatory submissions
(define-map regulatory-submissions
  { submission-id: (string-ascii 36) }
  {
    design-id: (string-ascii 36),
    test-ids: (list 20 (string-ascii 36)),
    regulatory-body: (string-utf8 100),
    submission-date: uint,
    status: uint,
    status-update-date: uint,
    approval-id: (optional (string-ascii 36)),
    comments: (string-utf8 500)
  }
)

;; Public function to create a regulatory submission
(define-public (create-submission
    (submission-id (string-ascii 36))
    (design-id (string-ascii 36))
    (test-ids (list 20 (string-ascii 36)))
    (regulatory-body (string-utf8 100))
    (comments (string-utf8 500)))
  (begin
    (asserts! (is-none (map-get? regulatory-submissions { submission-id: submission-id })) (err u1))
    (ok (map-set regulatory-submissions
      { submission-id: submission-id }
      {
        design-id: design-id,
        test-ids: test-ids,
        regulatory-body: regulatory-body,
        submission-date: block-height,
        status: STATUS_SUBMITTED,
        status-update-date: block-height,
        approval-id: none,
        comments: comments
      }
    ))
  )
)

;; Admin function to update submission status
(define-public (update-submission-status
    (submission-id (string-ascii 36))
    (new-status uint)
    (comments (string-utf8 500))
    (approval-id (optional (string-ascii 36))))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u2))
    (asserts! (is-some (map-get? regulatory-submissions { submission-id: submission-id })) (err u3))
    (asserts! (and (>= new-status STATUS_SUBMITTED) (<= new-status STATUS_REJECTED)) (err u4))

    (ok (map-set regulatory-submissions
      { submission-id: submission-id }
      (merge (unwrap-panic (map-get? regulatory-submissions { submission-id: submission-id }))
        {
          status: new-status,
          status-update-date: block-height,
          approval-id: approval-id,
          comments: comments
        }
      )
    ))
  )
)

;; Read-only function to get submission details
(define-read-only (get-submission-details (submission-id (string-ascii 36)))
  (map-get? regulatory-submissions { submission-id: submission-id })
)

;; Read-only function to check submission status
(define-read-only (get-submission-status (submission-id (string-ascii 36)))
  (match (map-get? regulatory-submissions { submission-id: submission-id })
    submission (ok (get status submission))
    (err u5)
  )
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u6))
    (ok (var-set admin new-admin))
  )
)
