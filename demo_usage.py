#!/usr/bin/env python3
"""
Demo script showing how the leining-app logic works.
This demonstrates the core functionality without the UI.
"""

from logic import (
    remove_nikud,
    normalize_hebrew,
    compare_hebrew_texts,
    has_reached_marker
)


def main():
    print("=" * 60)
    print("Leining App - Demo Usage")
    print("=" * 60)
    print()
    
    # Example reference verse (Genesis 1:1)
    reference_verse = "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
    print("Reference Verse (with Nikud):")
    print(f"  {reference_verse}")
    print()
    
    # Show verse without Nikud
    verse_without_nikud = remove_nikud(reference_verse)
    print("Reference Verse (without Nikud):")
    print(f"  {verse_without_nikud}")
    print()
    
    # Simulate transcription
    print("-" * 60)
    print("Simulation: User reads the verse...")
    print("-" * 60)
    print()
    
    # Partial transcription
    partial_transcription = "בראשית ברא אלהים את השמים"
    print(f"Transcription: {partial_transcription}")
    print()
    
    # Compare with reference
    exact_match, similarity = compare_hebrew_texts(
        reference_verse,
        partial_transcription,
        ignore_nikud=True
    )
    
    print(f"Exact match: {exact_match}")
    print(f"Similarity: {similarity:.1%}")
    print()
    
    # Check if marker word is reached
    marker_word = "השמים"  # "the heavens" - position of Etnahta
    marker_reached = has_reached_marker(partial_transcription, marker_word)
    
    print(f"Marker word '{marker_word}' reached: {marker_reached}")
    if marker_reached:
        print("✨ Visual flash animation would trigger here! ✨")
    print()
    
    # Full transcription
    print("-" * 60)
    print("Simulation: User completes the verse...")
    print("-" * 60)
    print()
    
    full_transcription = "בראשית ברא אלהים את השמים ואת הארץ"
    print(f"Transcription: {full_transcription}")
    print()
    
    exact_match, similarity = compare_hebrew_texts(
        reference_verse,
        full_transcription,
        ignore_nikud=True
    )
    
    print(f"Exact match: {exact_match}")
    print(f"Similarity: {similarity:.1%}")
    print()
    
    if exact_match:
        print("✅ Perfect match! Well done!")
    else:
        print(f"📊 You got {similarity:.0%} of the verse correct.")
    
    print()
    print("=" * 60)
    print("Demo complete! Run 'streamlit run app.py' to try the full app.")
    print("=" * 60)


if __name__ == "__main__":
    main()
