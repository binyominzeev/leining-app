#!/usr/bin/env python3
"""
Simple test script to verify the logic.py functions work correctly.
"""

from logic import (
    remove_nikud,
    normalize_hebrew,
    split_hebrew_words,
    compare_hebrew_texts,
    find_word_position,
    has_reached_marker
)


def test_remove_nikud():
    """Test Nikud removal."""
    text_with_nikud = "בְּרֵאשִׁית בָּרָא אֱלֹהִים"
    expected = "בראשית ברא אלהים"
    result = remove_nikud(text_with_nikud)
    assert result == expected, f"Expected '{expected}', got '{result}'"
    print("✓ test_remove_nikud passed")


def test_normalize_hebrew():
    """Test Hebrew text normalization."""
    text = "בְּרֵאשִׁית   בָּרָא  "
    expected = "בראשית ברא"
    result = normalize_hebrew(text)
    assert result == expected, f"Expected '{expected}', got '{result}'"
    print("✓ test_normalize_hebrew passed")


def test_split_hebrew_words():
    """Test Hebrew word splitting."""
    text = "בראשית ברא אלהים"
    expected = ["בראשית", "ברא", "אלהים"]
    result = split_hebrew_words(text)
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ test_split_hebrew_words passed")


def test_compare_hebrew_texts():
    """Test Hebrew text comparison."""
    ref = "בְּרֵאשִׁית בָּרָא אֱלֹהִים"
    trans = "בראשית ברא אלהים"
    exact, similarity = compare_hebrew_texts(ref, trans, ignore_nikud=True)
    assert exact, "Should be exact match when ignoring Nikud"
    assert similarity == 1.0, f"Expected 1.0 similarity, got {similarity}"
    print("✓ test_compare_hebrew_texts passed")


def test_find_word_position():
    """Test finding word position."""
    text = "בראשית ברא אלהים"
    word = "אלהים"
    position = find_word_position(text, word)
    assert position == 2, f"Expected position 2, got {position}"
    print("✓ test_find_word_position passed")


def test_has_reached_marker():
    """Test marker detection."""
    text = "בראשית ברא אלהים"
    marker = "אלהים"
    result = has_reached_marker(text, marker)
    assert result, "Should find marker in text"
    
    marker_not_present = "השמים"
    result = has_reached_marker(text, marker_not_present)
    assert not result, "Should not find marker that's not in text"
    print("✓ test_has_reached_marker passed")


def main():
    """Run all tests."""
    print("Running logic.py tests...\n")
    
    try:
        test_remove_nikud()
        test_normalize_hebrew()
        test_split_hebrew_words()
        test_compare_hebrew_texts()
        test_find_word_position()
        test_has_reached_marker()
        
        print("\n✅ All tests passed!")
        return 0
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
