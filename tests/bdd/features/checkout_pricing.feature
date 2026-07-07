Feature: Checkout pricing
  As a shopper
  I want the price I am charged to follow the store's published rules
  So that I can trust the total before I pay

  Background:
    Given I am signed in as "alice.qa@example.com"

  Scenario: Orders above the free-shipping threshold ship for free
    Given my cart contains 2 "Mechanical Keyboard"
    When I check out
    Then the subtotal is "$579.80"
    Then no discount is applied
    Then shipping is free
    Then the total is "$579.80"

  Scenario: A coupon is preferred over the volume discount when it is worth more
    Given my cart contains 1 "4K Monitor"
    When I check out with coupon "QA20"
    Then the discount is "$299.80" from "coupon"
    Then the total is "$1199.20"

  Scenario: The volume discount applies automatically past 1000.00
    Given my cart contains 10 "USB-C Hub"
    When I check out
    Then the discount is "$100.00" from "volume"
    Then the total is "$900.00"

  Scenario: A coupon that drops the order below the threshold brings shipping back
    Given my cart contains 1 "HD Webcam"
    When I check out with coupon "WELCOME10"
    Then the subtotal is "$300.00"
    Then the discount is "$30.00" from "coupon"
    Then shipping costs "$25.00"
    Then the total is "$295.00"

  Scenario Outline: Invalid coupons are rejected and nothing is charged
    Given my cart contains 1 "QA Mug"
    When I check out with coupon "<coupon>"
    Then checkout is rejected with "<error>"
    Then my cart still has 1 item

    Examples:
      | coupon   | error          |
      | BOGUS    | coupon_invalid |
      | LEGACY30 | coupon_expired |
