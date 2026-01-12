"""
Helper functions for Hebrew text comparison and processing.
"""

import re
from typing import List, Tuple


# Hebrew Nikud (vowel marks) Unicode ranges
NIKUD_PATTERN = re.compile(r'[\u0591-\u05C7]')


def remove_nikud(text: str) -> str:
    """
    Remove all Nikud (vowel marks and cantillation marks) from Hebrew text.
    
    Args:
        text: Hebrew text with Nikud
        
    Returns:
        Hebrew text without Nikud
    """
    return NIKUD_PATTERN.sub('', text)


def normalize_hebrew(text: str) -> str:
    """
    Normalize Hebrew text by removing Nikud and extra whitespace.
    
    Args:
        text: Hebrew text to normalize
        
    Returns:
        Normalized Hebrew text
    """
    text = remove_nikud(text)
    text = ' '.join(text.split())  # Remove extra whitespace
    return text.strip()


def split_hebrew_words(text: str) -> List[str]:
    """
    Split Hebrew text into individual words.
    
    Args:
        text: Hebrew text
        
    Returns:
        List of Hebrew words
    """
    return text.split()


def compare_hebrew_texts(reference: str, transcribed: str, ignore_nikud: bool = True) -> Tuple[bool, float]:
    """
    Compare two Hebrew texts and return similarity.
    
    Args:
        reference: Reference Hebrew text
        transcribed: Transcribed Hebrew text to compare
        ignore_nikud: Whether to ignore Nikud in comparison
        
    Returns:
        Tuple of (exact_match, similarity_score)
    """
    if ignore_nikud:
        ref_normalized = normalize_hebrew(reference)
        trans_normalized = normalize_hebrew(transcribed)
    else:
        ref_normalized = reference.strip()
        trans_normalized = transcribed.strip()
    
    # Check exact match
    exact_match = ref_normalized == trans_normalized
    
    # Calculate simple word-based similarity
    ref_words = split_hebrew_words(ref_normalized)
    trans_words = split_hebrew_words(trans_normalized)
    
    if not ref_words:
        return exact_match, 0.0
    
    # Count matching words (use set for better performance)
    ref_words_set = set(ref_words)
    matches = sum(1 for word in trans_words if word in ref_words_set)
    similarity = matches / len(ref_words) if ref_words else 0.0
    
    return exact_match, similarity


def find_word_position(text: str, word: str, ignore_nikud: bool = True) -> int:
    """
    Find the position (index) of a word in Hebrew text.
    
    Args:
        text: Hebrew text to search in
        word: Word to find
        ignore_nikud: Whether to ignore Nikud in search
        
    Returns:
        Index of the word (0-based), or -1 if not found
    """
    if ignore_nikud:
        text_normalized = normalize_hebrew(text)
        word_normalized = normalize_hebrew(word)
    else:
        text_normalized = text
        word_normalized = word
    
    words = split_hebrew_words(text_normalized)
    try:
        return words.index(word_normalized)
    except ValueError:
        return -1


def has_reached_marker(transcribed: str, marker_word: str, ignore_nikud: bool = True) -> bool:
    """
    Check if the transcribed text has reached a specific marker word (e.g., Etnahta or Sof Pasuk).
    
    Args:
        transcribed: Transcribed Hebrew text
        marker_word: The marker word to check for
        ignore_nikud: Whether to ignore Nikud in comparison
        
    Returns:
        True if marker word is found in transcribed text
    """
    if ignore_nikud:
        trans_normalized = normalize_hebrew(transcribed)
        marker_normalized = normalize_hebrew(marker_word)
    else:
        trans_normalized = transcribed
        marker_normalized = marker_word
    
    return marker_normalized in trans_normalized
