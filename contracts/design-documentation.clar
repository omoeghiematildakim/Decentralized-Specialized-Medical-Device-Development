;; Design Documentation Contract
;; This contract securely stores device specifications

(define-data-var admin principal tx-sender)

;; Data structure for device designs
(define-map device-designs
  { design-id: (string-ascii 36) }
  {
    inventor-id: (string-ascii 36),
    name: (string-utf8 100),
    description: (string-utf8 500),
    specifications: (string-utf8 1000),
    documentation-hash: (buff 32),
    creation-date: uint,
    last-updated: uint,
    version: uint
  }
)

;; Data structure for design version history
(define-map design-versions
  { design-id: (string-ascii 36), version: uint }
  {
    specifications: (string-utf8 1000),
    documentation-hash: (buff 32),
    update-date: uint
  }
)

;; Public function to register a new device design
(define-public (register-design
    (design-id (string-ascii 36))
    (inventor-id (string-ascii 36))
    (name (string-utf8 100))
    (description (string-utf8 500))
    (specifications (string-utf8 1000))
    (documentation-hash (buff 32)))
  (begin
    (asserts! (is-none (map-get? device-designs { design-id: design-id })) (err u1))
    (ok (map-set device-designs
      { design-id: design-id }
      {
        inventor-id: inventor-id,
        name: name,
        description: description,
        specifications: specifications,
        documentation-hash: documentation-hash,
        creation-date: block-height,
        last-updated: block-height,
        version: u1
      }
    ))
  )
)

;; Public function to update a device design
(define-public (update-design
    (design-id (string-ascii 36))
    (specifications (string-utf8 1000))
    (documentation-hash (buff 32)))
  (let ((current-design (unwrap! (map-get? device-designs { design-id: design-id }) (err u2)))
        (current-version (get version current-design)))

    ;; Store the previous version in history
    (map-set design-versions
      { design-id: design-id, version: current-version }
      {
        specifications: (get specifications current-design),
        documentation-hash: (get documentation-hash current-design),
        update-date: (get last-updated current-design)
      }
    )

    ;; Update the current design
    (ok (map-set device-designs
      { design-id: design-id }
      (merge current-design
        {
          specifications: specifications,
          documentation-hash: documentation-hash,
          last-updated: block-height,
          version: (+ current-version u1)
        }
      )
    ))
  )
)

;; Read-only function to get design details
(define-read-only (get-design-details (design-id (string-ascii 36)))
  (map-get? device-designs { design-id: design-id })
)

;; Read-only function to get a specific version of a design
(define-read-only (get-design-version (design-id (string-ascii 36)) (version uint))
  (map-get? design-versions { design-id: design-id, version: version })
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u5))
    (ok (var-set admin new-admin))
  )
)
