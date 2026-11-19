import React from "react";
import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";

export default function ImagePreviewModal({
    open = false,
    onClose = () => {},
    src,
    alt = "Pratinjau gambar",
    title = "Pratinjau Gambar",
}) {
    return (
        <Transition show={open}>
            <Dialog
                as="div"
                className="relative z-[70]"
                onClose={onClose}
            >
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
                    <TransitionChild
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Tutup pratinjau"
                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4">
                                <img
                                    src={src}
                                    alt={alt}
                                    className="max-h-[75vh] max-w-full object-contain"
                                />
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
