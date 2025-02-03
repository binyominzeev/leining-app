import tkinter as tk
from tkinter import font as tkfont, messagebox, ttk
import pygame
import time
from pathlib import Path
import math
import sys
import bidi.algorithm
import os
from mutagen.mp3 import MP3

class TorahReader(tk.Tk):
    def __init__(self):
        super().__init__()

        # Initialize pygame mixer for audio
        pygame.mixer.init()
        
        # Configuration
        self.TOTAL_LINES = 7
        self.MAIN_LINES = 3
        self.current_file = None
        
        # Setup window
        self.title("Torah Reader")
        self.geometry("1000x600")
        
        # Create main container
        self.main_container = ttk.PanedWindow(self, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        # Create sidebar
        self.create_sidebar()
        
        # Create main content area
        self.content_frame = ttk.Frame(self.main_container)
        self.main_container.add(self.content_frame)
        
        # Try to load Hebrew font
        try:
            self.hebrew_font = tkfont.Font(family="David", size=24)
        except:
            fallback_fonts = ["Arial Hebrew", "Times New Roman", "Arial"]
            for font_name in fallback_fonts:
                try:
                    self.hebrew_font = tkfont.Font(family=font_name, size=24)
                    break
                except:
                    continue

        # Create canvas for text display
        self.canvas = tk.Canvas(self.content_frame, width=780, height=380, bg='white')
        self.canvas.pack(pady=10, expand=True, fill=tk.BOTH)

        # Setup controls
        self.setup_controls()
        
        # Create status bar
        self.create_status_bar()
        
        # Scan for available files
        self.scan_files()

    def create_sidebar(self):
        # Create sidebar frame
        self.sidebar = ttk.Frame(self.main_container, width=200)
        self.main_container.add(self.sidebar)
        
        # Create label
        ttk.Label(self.sidebar, text="Available Readings").pack(pady=5)
        
        # Create listbox
        self.file_listbox = tk.Listbox(self.sidebar, width=25)
        self.file_listbox.pack(pady=5, padx=5, fill=tk.BOTH, expand=True)
        self.file_listbox.bind('<<ListboxSelect>>', self.on_file_select)

    def create_status_bar(self):
        self.status_bar = ttk.Frame(self)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Create labels for different status items
        self.duration_label = ttk.Label(self.status_bar, text="Duration: --:--")
        self.duration_label.pack(side=tk.LEFT, padx=5)
        
        ttk.Separator(self.status_bar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)
        
        self.words_label = ttk.Label(self.status_bar, text="Words: ---")
        self.words_label.pack(side=tk.LEFT, padx=5)
        
        ttk.Separator(self.status_bar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)
        
        self.speed_label = ttk.Label(self.status_bar, text="Speed: --- words/min")
        self.speed_label.pack(side=tk.LEFT, padx=5)

    def scan_files(self):
        keriyos_path = Path("keriyos")
        if not keriyos_path.exists():
            messagebox.showwarning("Warning", "keriyos folder not found")
            return
            
        # Find all matching mp3/txt pairs
        mp3_files = set(f.stem for f in keriyos_path.glob("*.mp3"))
        txt_files = set(f.stem for f in keriyos_path.glob("*.txt"))
        
        # Get intersection of both sets
        matching_files = sorted(mp3_files.intersection(txt_files))
        
        # Clear and populate listbox
        self.file_listbox.delete(0, tk.END)
        for file in matching_files:
            self.file_listbox.insert(tk.END, file)

    def on_file_select(self, event):
        selection = self.file_listbox.curselection()
        if not selection:
            return
            
        filename = self.file_listbox.get(selection[0])
        self.current_file = filename
        self.load_file(filename)

    def load_file(self, filename):
        try:
            # Stop any playing audio
            self.stop_reading()
            
            # Load text file
            txt_path = Path("keriyos") / f"{filename}.txt"
            with open(txt_path, 'r', encoding='utf-8') as file:
                self.text = file.read()
                self.words = self.text.split()
                self.total_words = len(self.words)
                self.lines = self.split_into_lines(self.text, 40)
                self.lines = [bidi.algorithm.get_display(line) for line in self.lines]
            
            # Get MP3 duration
            mp3_path = Path("keriyos") / f"{filename}.mp3"
            audio = MP3(str(mp3_path))
            self.AUDIO_LENGTH_SECONDS = int(audio.info.length)
            
            # Calculate words per minute
            self.WORDS_PER_MINUTE = (self.total_words * 60) / (self.AUDIO_LENGTH_SECONDS)
            
            # Update status bar
            minutes = self.AUDIO_LENGTH_SECONDS // 60
            seconds = self.AUDIO_LENGTH_SECONDS % 60
            self.duration_label.config(text=f"Duration: {minutes:02d}:{seconds:02d}")
            self.words_label.config(text=f"Words: {self.total_words}")
            self.speed_label.config(text=f"Speed: {self.WORDS_PER_MINUTE:.1f} words/min")
            
            # Calculate timing and draw initial text
            self.calculate_timing()
            self.draw_initial_text()
            
        except Exception as e:
            messagebox.showerror("Error", f"Error loading file: {e}")

    def get_color_for_opacity(self, opacity):
        """Convert opacity (0-1) to a valid Tkinter color"""
        if opacity >= 0.9:
            return 'black'
        elif opacity >= 0.6:
            return 'gray30'
        elif opacity >= 0.3:
            return 'gray50'
        else:
            return 'gray70'

    def draw_initial_text(self):
        self.canvas.delete("all")
        
        for i in range(min(self.TOTAL_LINES, len(self.lines))):
            distance_from_center = abs(i - self.MAIN_LINES//2)
            opacity = 1.0 if distance_from_center <= self.MAIN_LINES//2 else 0.3
            color = self.get_color_for_opacity(opacity)
            
            y_position = 190 + ((i - self.MAIN_LINES//2) * 40)
            text = self.lines[i]
            
            self.canvas.create_text(
                390,
                y_position,
                text=text,
                font=self.hebrew_font,
                fill=color,
                anchor='center'
            )

    def split_into_lines(self, text, chars_per_line):
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= chars_per_line:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)
                
        if current_line:
            lines.append(' '.join(current_line))
            
        return lines

    def calculate_timing(self):
        """Calculate scrolling speed based on audio duration"""
        self.words_per_second = self.WORDS_PER_MINUTE / 60
        self.total_duration = self.total_words / self.words_per_second
        
        # Calculate total height of text (40 pixels per line)
        total_scroll_distance = (len(self.lines) * 40)
        
        # Calculate pixels per second needed to complete scroll during audio duration
        # Subtract a small buffer (2 seconds) from audio length to ensure we don't finish early
        self.pixels_per_second = total_scroll_distance / (self.AUDIO_LENGTH_SECONDS - 2)
        #print(f"Debug: Total lines: {len(self.lines)}")
        #print(f"Debug: Total scroll distance: {total_scroll_distance} pixels")
        #print(f"Debug: Audio duration: {self.AUDIO_LENGTH_SECONDS} seconds")
        #print(f"Debug: Scroll speed: {self.pixels_per_second} pixels/second")

    def setup_controls(self):
        control_frame = ttk.Frame(self.content_frame)
        control_frame.pack(pady=5)
        
        self.start_button = ttk.Button(control_frame, text="Start", command=self.start_reading)
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.stop_button = ttk.Button(control_frame, text="Stop", command=self.stop_reading)
        self.stop_button.pack(side=tk.LEFT, padx=5)
        self.stop_button.config(state=tk.DISABLED)

    def start_reading(self):
        if not self.current_file:
            messagebox.showwarning("Warning", "Please select a file first")
            return
            
        try:
            mp3_path = Path("keriyos") / f"{self.current_file}.mp3"
            pygame.mixer.music.load(str(mp3_path))
            pygame.mixer.music.play()
            
            self.start_button.config(state=tk.DISABLED)
            self.stop_button.config(state=tk.NORMAL)
            
            self.scroll_position = 0
            self.last_update = time.time()
            self.update_text()
            
        except Exception as e:
            messagebox.showerror("Error", f"Could not start playback: {e}")

    def stop_reading(self):
        pygame.mixer.music.stop()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        if hasattr(self, 'update_id'):
            self.after_cancel(self.update_id)

    def update_text(self):
        """Update text position with corrected timing"""
        self.canvas.delete("all")
        current_time = time.time()
        elapsed = current_time - self.last_update
        
        # Limit the elapsed time to prevent large jumps
        elapsed = min(elapsed, 0.1)
        
        self.scroll_position += self.pixels_per_second * elapsed
        self.last_update = current_time

        # Calculate which lines should be visible
        center_line_index = int(self.scroll_position / 40)
        
        for i in range(-((self.TOTAL_LINES-1)//2), ((self.TOTAL_LINES-1)//2) + 1):
            line_index = center_line_index + i
            if 0 <= line_index < len(self.lines):
                # Calculate opacity based on distance from center
                distance_from_center = abs(i)
                if distance_from_center <= self.MAIN_LINES // 2:
                    opacity = 1.0
                else:
                    opacity = 0.3
                
                color = self.get_color_for_opacity(opacity)
                
                y_position = 190 + (i * 40) - (self.scroll_position % 40)
                self.canvas.create_text(
                    390,  # Center horizontally
                    y_position,
                    text=self.lines[line_index],
                    font=self.hebrew_font,
                    fill=color,
                    anchor='center'
                )

        # Check if we should continue scrolling
        if self.scroll_position < (len(self.lines) * 40):
            self.update_id = self.after(33, self.update_text)  # Update approximately 30 times per second
        #else:
        #    self.stop_reading()

if __name__ == "__main__":
    app = TorahReader()
    app.mainloop()
