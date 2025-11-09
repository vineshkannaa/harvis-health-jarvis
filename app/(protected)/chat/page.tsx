'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { BottomNav } from '@/components/bottom-nav';
import { Loader } from '@/components/ai-elements/loader';
import { Fragment, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, RefreshCcwIcon } from 'lucide-react';

const ChatPage = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) {
      return;
    }

    sendMessage({
      text: message.text || '',
    });
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrollable conversation area */}
      <div className="flex-1 overflow-y-auto pb-48">
        <Conversation className="min-h-full">
          <ConversationContent className="px-4 py-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <h1 className="text-2xl font-bold">Chat with HARVIS</h1>
                <p className="text-muted-foreground max-w-md">
                  Ask me about your diet, workouts, calories, macros, or get
                  personalized health insights!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent
                              className={
                                message.role === 'user'
                                  ? '!text-black [&_*]:!text-black'
                                  : ''
                              }
                            >
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' &&
                            i === message.parts.length - 1 &&
                            message.id === messages[messages.length - 1]?.id && (
                              <MessageActions className="mt-2">
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                        </Fragment>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}

            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Fixed input bar above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 z-40 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 py-2">
          <PromptInput onSubmit={handleSubmit} className="w-full max-w-full">
            <PromptInputBody className="w-full">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="Ask HARVIS about your health data..."
                className="w-full max-w-full"
              />
            </PromptInputBody>
            <PromptInputFooter className="w-full max-w-full justify-end">
              <PromptInputSubmit
                disabled={!input && status !== 'submitted'}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <BottomNav onAddClick={() => {}} />
    </div>
  );
};

export default ChatPage;
