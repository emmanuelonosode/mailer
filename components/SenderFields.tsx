"use client";

interface SenderFieldsProps {
  senderName: string;
  onSenderNameChange: (v: string) => void;
  senderEmail: string;
  onSenderEmailChange: (v: string) => void;
}

export default function SenderFields({
  senderName, onSenderNameChange,
  senderEmail, onSenderEmailChange,
}: SenderFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="field-label">From Name</label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => onSenderNameChange(e.target.value)}
          placeholder="Hasker & Co. Realty Group"
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label">From Email</label>
        <input
          type="email"
          value={senderEmail}
          onChange={(e) => onSenderEmailChange(e.target.value)}
          placeholder="contact@haskerrealty.com"
          className="field-input"
        />
      </div>
    </div>
  );
}
