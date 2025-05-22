import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeechQueue = () => {
  const [speechQueue, setSpeechQueue] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const synth = synthRef.current;
    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      console.log('Synthèse vocale supportée. Voices disponibles :', availableVoices);
      setVoices(availableVoices);
    };

    updateVoices();
    synth.onvoiceschanged = updateVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const queueSpeech = useCallback((text) => {
    setSpeechQueue((prevQueue) => [...prevQueue, text]);
  }, []);

  const speakNext = useCallback(() => {
    if (!speechQueue.length || !synthRef.current || isSpeaking) {
      console.log('speakNext: File vide ou synthèse vocale non supportée');
      return;
    }

    const text = speechQueue[0];
    const utterance = new SpeechSynthesisUtterance(text);
    const frenchVoice = voices.find((voice) => voice.lang.includes('fr'));
    if (frenchVoice) {
      console.log('Voix sélectionnée :', frenchVoice.name);
      utterance.voice = frenchVoice;
    }

    utterance.onstart = () => {
      console.log('Début lecture vocale:', text);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('Fin lecture vocale:', text);
      setIsSpeaking(false);
      setSpeechQueue((prevQueue) => prevQueue.slice(1));
    };
    utterance.onerror = (event) => {
      console.error('Erreur synthèse vocale:', event.error);
      setIsSpeaking(false);
      setSpeechQueue((prevQueue) => prevQueue.slice(1));
    };

    console.log('Lancement de la synthèse pour:', text);
    synthRef.current.speak(utterance);
  }, [speechQueue, isSpeaking, voices]);

  useEffect(() => {
    if (!isSpeaking) {
      speakNext();
    }
  }, [isSpeaking, speechQueue, speakNext]);

  return { queueSpeech, isSpeaking };
};

export default useSpeechQueue;
