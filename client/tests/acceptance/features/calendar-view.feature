Feature: Calendar view
  Background:
    Given the user is logged in with email or username "demo" and password "demo"
    And a board with a card due today exists

  Scenario: A card opens from the day it is due and the view is kept
    When the user opens the board
    And the user switches to the calendar view
    Then the card should appear on today in the calendar
    When the user opens the card from the calendar
    Then the card modal should be displayed
    When the user closes the card modal
    Then the calendar view should still be selected

  Scenario: A card without a due date is counted rather than hidden silently
    Given the board also has a card without a due date
    When the user opens the board
    And the user switches to the calendar view
    Then the calendar should report 1 card without a due date
