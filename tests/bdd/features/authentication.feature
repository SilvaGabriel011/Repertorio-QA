Feature: Authentication
  As the store
  I want to authenticate shoppers safely
  So that accounts and carts stay protected

  Scenario: A shopper signs in with valid credentials
    When I sign in as "alice.qa@example.com" with password "S3curePass!"
    Then I receive a session token

  Scenario: A wrong password is refused
    When I sign in as "alice.qa@example.com" with password "WrongPass1!"
    Then sign-in is refused with "invalid_credentials"

  Scenario: Repeated failures lock the account
    Given sign-in has failed 5 times for "locked.user@example.com"
    When I sign in as "locked.user@example.com" with password "WrongPass1!"
    Then sign-in is throttled
